import AddSubPainPointUpdateForm from './add-sub-update-form';

export default async function AddSubPainPointUpdatePage({
  params,
}: {
  params: Promise<{ slug: string; subSlug: string }>;
}) {
  const { slug, subSlug } = await params;
  return <AddSubPainPointUpdateForm slug={slug} subSlug={subSlug} />;
}
