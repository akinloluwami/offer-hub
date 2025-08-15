"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formSchema } from "../schemas/start-dispute-form.schema";
import { toast } from "sonner";
// import {
//   StartDisputePayload,
//   EscrowRequestResponse,
// } from "@trustless-work/escrow/types"; // Temporarily commented - types not exported correctly
// import {
//   useSendTransaction,
//   useStartDispute as useStartDisputeHook,
// } from "@trustless-work/escrow/hooks"; // Temporarily commented

export const useStartDisputeForm = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null); // Temporarily using any
  // const { startDispute } = useStartDisputeHook(); // Temporarily commented
  // const { sendTransaction } = useSendTransaction(); // Temporarily commented

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractId: "",
      signer: "",
    },
  });

  const onSubmit = async (payload: any) => { // Temporarily using any
    setLoading(true);
    setResponse(null);

    try {
      // const { unsignedTransaction } = await startDispute(payload); // Temporarily commented
      // Temporary placeholder implementation
      const unsignedTransaction = null;  

      if (!unsignedTransaction) {
        throw new Error(
          "Dispute functionality temporarily unavailable - escrow hooks not configured."
        );
      }

      // TODO: Implement proper wallet signing
      // const signedXdr = await signTransaction({
      //   unsignedTransaction,
      //   address: payload.signer,
      // });
      
      // Placeholder for now - implement wallet integration
      const signedXdr = "PLACEHOLDER_SIGNED_XDR";

      if (!signedXdr) {
        throw new Error("Signed transaction is missing.");
      }

      // const data = await sendTransaction({ // Temporarily commented
      //   signedXdr,
      //   returnEscrowDataIsRequired: false,
      // });
      const data = { status: "SUCCESS", message: "Temporary success" }; // Temporary placeholder

      if (data.status === "SUCCESS") {
        setResponse(data);
        toast.success("Dispute started successfully!");
        form.reset();
      } else {
        throw new Error(data.message || "Transaction failed");
      }
    } catch (error) {
      console.error("Error starting dispute:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    response,
    onSubmit,
  };
};