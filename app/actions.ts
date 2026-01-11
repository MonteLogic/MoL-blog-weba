'use server';

import { revalidatePath } from 'next/cache';

export async function revalidatePainPoints() {
  revalidatePath('/blog/pain-points');
}
