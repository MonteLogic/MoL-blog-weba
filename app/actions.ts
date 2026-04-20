'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function revalidatePainPoints() {
  revalidateTag('pain-points', 'default');
  revalidatePath('/blog/pain-points');
}
