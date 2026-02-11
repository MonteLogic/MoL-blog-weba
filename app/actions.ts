'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function revalidatePainPoints() {
  revalidateTag('pain-points');
  revalidatePath('/blog/pain-points');
}
