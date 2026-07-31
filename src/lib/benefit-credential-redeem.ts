import { prisma } from "@/lib/prisma";

export async function isBenefitCredentialJtiRedeemed(jti: string): Promise<boolean> {
  const existing = await prisma.benefitRedemption.findUnique({
    where: { credentialJti: jti },
    select: { id: true },
  });
  return Boolean(existing);
}
