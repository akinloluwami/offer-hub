import { useState } from 'react';
import { useReleaseFunds as usePackageReleaseFunds, useSendTransaction, /* ReleaseFundsPayload, */ EscrowRequestResponse } from '@trustless-work/escrow';

/**
 * Hook to release escrow funds using the @trustless-work/escrow package.
 * @Note:
 * - This hook releases funds from an existing escrow contract
 * - It requires a contractId and signer address
 * - The release signer must be authorized to release funds
 */
export const useReleaseFunds = () => {
    const { releaseFunds, isPending, isError, isSuccess } = usePackageReleaseFunds();
    const { sendTransaction } = useSendTransaction();
    const [error, setError] = useState<Error | null>(null);
    const [response, setResponse] = useState<EscrowRequestResponse | null>(null);

    /**
     * @Note:
     * - We need to pass the payload to the releaseFunds function
     */
    const handleReleaseFunds = async (payload: any) => { // Temporarily using any - ReleaseFundsPayload not exported
        if (!payload.contractId || !payload.signer) {
            throw new Error('Contract ID and signer are required');
        }

    /* 
     * - It returns an unsigned transaction
     * - payload should be of type `MultiReleaseReleaseFundsPayload` or `SingleReleaseReleaseFundsPayload`
    */

        try {
            const { unsignedTransaction } = await releaseFunds({
                payload,
                type: 'multi-release' // single-release or multi-release
            });

            if (!unsignedTransaction) {
                throw new Error('Unsigned transaction is missing from releaseFunds response.');
            }

            /**
             * @Note:
             * - We need to sign the transaction using your private key, can be supplied from stellar-wallet-kit or env variable
             * - The result will be a signed transaction
             */
            // const signedXdr = await signTransaction({
            //   unsignedTransaction,
            //   address: payload.signer || walletAddress || '',
            // });

            // For now, we'll just use the unsigned transaction as an example
            const signedXdr = unsignedTransaction;

            if (!signedXdr) {
                throw new Error('Signed transaction is missing.');
            }

            /**
             * @Note:
             * - We need to send the signed transaction to the API
             * - The result will be a SendTransactionResponse
             */
            const data = await sendTransaction(signedXdr);

            if (data.status === 'SUCCESS') {
                /**
                 * @Note:
                 * - The escrow was released successfully
                 * - Save the response in your global state
                 * - Here, you can update the escrow in your database
                 * - You can also show a success toast
                 */
                setResponse(data);
            } else {
                throw new Error('Failed to release escrow funds');
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to release escrow funds'));
            throw err;
        }
    };

    return {
        handleReleaseFunds,
        loading: isPending,
        error: error || (isError ? new Error('Trustless Work error occurred') : null),
        isSuccess,
        response,
    };
};
