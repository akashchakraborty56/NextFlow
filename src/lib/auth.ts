import { auth } from '@clerk/nextjs/server';
import { prisma } from './db';

/**
 * Get the authenticated user's database record.
 * Creates the user if it doesn't exist (first-time sync from Clerk).
 */
export async function getAuthUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    const { sessionClaims } = await auth();
    console.log('Creating new user from Clerk sync:', clerkId);
    
    // Attempt to get email from claims, default to unique clerk placeholder if missing
    const email = (sessionClaims as any)?.email || (sessionClaims as any)?.primary_email || `${clerkId}@clerk.dev`;
    const name = (sessionClaims as any)?.name || (sessionClaims as any)?.full_name || null;

    try {
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name,
        },
      });
      console.log('Successfully created user:', user.id);
    } catch (err) {
      console.error('Failed to create user during Clerk sync:', err);
      throw new Error('Database user sync failed');
    }
  }

  return user;
}
