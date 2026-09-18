import { OutfitLoadingState } from "../../src/components/outfits/OutfitLoadingState";

export default function Loading() {
  return <OutfitLoadingState variant="list" title="코디 요청을 불러오는 중" description="요청과 제안을 준비하고 있습니다." />;
}
