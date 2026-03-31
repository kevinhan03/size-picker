import { ProductModalClient } from "../../../../src/components/ProductModalClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductModalPage({ params }: Props) {
  const { id } = await params;
  return <ProductModalClient id={id} />;
}
