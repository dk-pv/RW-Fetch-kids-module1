export async function generateOrderId() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${rand}`;
}
