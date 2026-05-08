import type { MessagingAdapter, MessagingType } from "../types";
import { AiSensyAdapter } from "./aisensy.adapter";
import { Msg91Adapter } from "./msg91.adapter";
import { ExotelAdapter } from "./exotel.adapter";

const messagingRegistry: Partial<Record<MessagingType, MessagingAdapter>> = {
  aisensy: new AiSensyAdapter(),
  msg91: new Msg91Adapter(),
  exotel: new ExotelAdapter(),
  // interakt + wati are roadmapped — same interface, swap-in when needed
};

export function getMessagingAdapter(type: MessagingType): MessagingAdapter | undefined {
  return messagingRegistry[type];
}

export { AiSensyAdapter, Msg91Adapter, ExotelAdapter };
