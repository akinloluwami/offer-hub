"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useWalletContext } from "@/providers/wallet.provider"
import { signTransaction } from "../auth/helpers/stellar-wallet-kit.hellper"
import { handleError } from "@/errors/utils/handle-errors"
import type { AxiosError } from "axios"
import type { WalletError } from "@/types/errors.entity"
// import type { EscrowRequestResponse, ResolveDisputePayload } from "@trustless-work/escrow/types" // Temporarily commented - types not exported correctly
// import { useResolveDispute as useResolveDisputeAPI, useSendTransaction } from "@trustless-work/escrow/hooks" // Temporarily commented

export const useResolveDispute = () => {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any | null>(null) // Temporarily using any
  const { walletAddress } = useWalletContext()
  // const { resolveDispute: resolveDisputeAPI } = useResolveDisputeAPI() // Temporarily commented
  // const { sendTransaction } = useSendTransaction() // Temporarily commented

  const resolveDispute = async (payload: any) => { // Temporarily using any
    setLoading(true)
    setResponse(null)

    try {
      /**
       * API call by using the trustless work hooks
       * @Note:
       * - We need to pass the payload to the resolveDispute function
       * - The result will be an unsigned transaction
       */
      // const { unsignedTransaction } = await resolveDisputeAPI(payload) // Temporarily commented
      const unsignedTransaction = null // Temporary placeholder

      if (!unsignedTransaction) {
        throw new Error("Unsigned transaction is missing from resolveDispute response.")
      }

      /**
       * @Note:
       * - We need to sign the transaction using your private key
       * - The result will be a signed transaction
       */
      const signedXdr = await signTransaction({
        unsignedTransaction,
        address: walletAddress || "",
      })

      if (!signedXdr) {
        throw new Error("Signed transaction is missing.")
      }

      /**
       * @Note:
       * - We need to send the signed transaction to the API
       * - The data will be an SendTransactionResponse
       */
      // const data = await sendTransaction({ // Temporarily commented
      //   signedXdr,
      //   returnEscrowDataIsRequired: false,
      // })
      const data = null // Temporary placeholder

      /**
       * @Responses:
       * data.status === "SUCCESS"
       * - Escrow updated successfully
       * - Show a success toast
       *
       * data.status == "ERROR"
       * - Show an error toast
       */
      if (data && (data as any).status === "SUCCESS") {
        toast.success("Dispute resolved successfully", {
          description: "The dispute has been resolved and funds have been distributed.",
        })
        setResponse(data)
      } else {
        throw new Error("Transaction failed or returned an error status")
      }

      return data
    } catch (error: unknown) {
      const mappedError = handleError(error as AxiosError | WalletError)
      console.error("Error resolving dispute:", mappedError.message)

      toast.error("Failed to resolve dispute", {
        description: mappedError ? mappedError.message : "An unknown error occurred",
      })

      throw mappedError
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResponse(null)
    setLoading(false)
  }

  return {
    resolveDispute,
    loading,
    response,
    reset,
    isResolving: loading,
  }
}
