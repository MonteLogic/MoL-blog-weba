import AddSubPainPointForm from './add-sub-pain-point-form';

export default async function AddSubPainPointPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AddSubPainPointForm slug={slug} />;
}
