import { Landmark, MapPin, Signature, UserRound, Users } from "lucide-vue-next";
import type { IconKey } from "./script";

/** מיפוי מפתחות האייקונים שבתסריט לאייקוני lucide */
export const ICONS: Record<IconKey, typeof MapPin> = {
  map: MapPin,
  users: Users,
  bank: Landmark,
  user: UserRound,
  signature: Signature,
};
