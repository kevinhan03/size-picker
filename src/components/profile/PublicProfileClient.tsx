import type { PublicProfile } from "../../utils/profile";
import { ProfileView } from "./ProfileView";

export function PublicProfileClient({
  profile,
  initialContentTab,
}: {
  profile: PublicProfile;
  initialContentTab?: "posts" | "closet";
}) {
  return <ProfileView profile={profile} initialContentTab={initialContentTab} />;
}
