import AddUpdateForm from './add-update-form';

export default async function AddUpdatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AddUpdateForm slug={slug} />;
}
