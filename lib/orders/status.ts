export const ORDER_STATUSES = [
  "requested",
  "reviewing",
  "awaiting_customer",
  "accepted",
  "awaiting_payment",
  "paid",
  "preparing",
  "shipped",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  requested: "Requested",
  reviewing: "Being reviewed",
  awaiting_customer: "Waiting for your reply",
  accepted: "Accepted",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  preparing: "Being prepared",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};
