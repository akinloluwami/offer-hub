import { useInitializeContract } from "./useInitializeContract";

export const ExampleInitializeContract = () => {
  const { handleSubmit } = useInitializeContract();

  // Mock payload MultiRelease escrow
  const payload = {
    engagementId: "xCompany & xClient", // Unique identifier for the escrow

    title: "Develop a Website", // Name of the escrow

    description: "Develop a website for my company", // Description of the escrow

    platformFee: "3", // Commission that OfferHub will receive when the escrow is released or resolved. You must choose how much you want to receive.

    receiverMemo: 90909090, // optional! Field used to identify the recipient's address in transactions through an intermediary account. This value is included as a memo in the transaction and allows the funds to be correctly routed to the wallet of the specified recipient

    roles: {
      approver: "GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD", // Client
      serviceProvider:
        "GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD", // Freelancer
      platformAddress:
        "GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD", // OfferHub
      releaseSigner: "GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD", // OfferHub
      disputeResolver:
        "GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD", // Intermediario
      receiver: "GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD", // Freelancer
    },
    trustline: {
      // This is USDC trustline
      address: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
      decimals: 10000000,
    },
    // Milestones are the steps of the escrow
    milestones: [
      {
        description: "Create the brandbook",
        amount: "200",
      },
      {
        description: "Build the website",
        amount: "1000",
      },
      {
        description: "Test and deploy",
        amount: "300",
      },
    ],
    signer: "GAWVVSA6OUB2T2A6Q4E4YS75PO32YK7TKQJQDODA4GAY7SHGQOETVYPD", // Address of the user signing the contract transaction
  };

  return (
    <div>
      <h1>Example Initialize Contract</h1>

      {/*
       * Create a form...
       */}
      <button onClick={() => handleSubmit(payload)}>
        Initialize Contract between client and freelancer
      </button>
    </div>
  );
};
