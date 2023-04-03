import {
  getGovernanceProgramVersion,
  getInstructionDataFromBase64,
  getSignatoryRecordAddress,
  ProgramAccount,
  serializeInstructionToBase64,
  SYSTEM_PROGRAM_ID,
  TokenOwnerRecord,
  VoteType,
  WalletSigner,
  withAddSignatory,
  withCreateProposal,
  withInsertTransaction,
  withSignOffProposal,
} from '@solana/spl-governance'
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js'
import { chunk } from 'lodash'
import { MANGO_MINT } from 'utils/constants'
import { MANGO_GOVERNANCE_PROGRAM, MANGO_REALM_PK } from './constants'
import { DEFAULT_VSR_ID, VsrClient } from './voteStakeRegistryClient'
import { getRegistrarPDA, getVoterPDA, getVoterWeightPDA } from './vsrAccounts'
import { sendSignAndConfirmTransactions } from '@blockworks-foundation/mangolana/lib/transactions'
import { SequenceType } from '@blockworks-foundation/mangolana/lib/globalTypes'

export const createProposal = async (
  connection: Connection,
  wallet: WalletSigner,
  governance: PublicKey,
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>,
  name: string,
  descriptionLink: string,
  proposalIndex: number,
  proposalInstructions: TransactionInstruction[],
  client: VsrClient
) => {
  const instructions: TransactionInstruction[] = []
  const walletPk = wallet.publicKey!
  const governanceAuthority = walletPk
  const signatory = walletPk
  const payer = walletPk

  // Changed this because it is misbehaving on my local validator setup.
  const programVersion = await getGovernanceProgramVersion(
    connection,
    MANGO_GOVERNANCE_PROGRAM
  )

  // V2 Approve/Deny configuration
  const voteType = VoteType.SINGLE_CHOICE
  const options = ['Approve']
  const useDenyOption = true

  //will run only if plugin is connected with realm
  const { registrar } = await getRegistrarPDA(
    MANGO_REALM_PK,
    new PublicKey(MANGO_MINT),
    DEFAULT_VSR_ID
  )
  const { voter } = await getVoterPDA(registrar, walletPk, DEFAULT_VSR_ID)
  const { voterWeightPk } = await getVoterWeightPDA(
    registrar,
    walletPk,
    DEFAULT_VSR_ID
  )
  const updateVoterWeightRecordIx = await client.program.methods
    .updateVoterWeightRecord()
    .accounts({
      registrar,
      voter,
      voterWeightRecord: voterWeightPk,
      systemProgram: SYSTEM_PROGRAM_ID,
    })
    .instruction()
  instructions.push(updateVoterWeightRecordIx)

  const proposalAddress = await withCreateProposal(
    instructions,
    MANGO_GOVERNANCE_PROGRAM,
    programVersion,
    MANGO_REALM_PK,
    governance,
    tokenOwnerRecord.pubkey,
    name,
    descriptionLink,
    new PublicKey(MANGO_MINT),
    governanceAuthority,
    proposalIndex,
    voteType,
    options,
    useDenyOption,
    payer,
    voterWeightPk
  )

  await withAddSignatory(
    instructions,
    MANGO_GOVERNANCE_PROGRAM,
    programVersion,
    proposalAddress,
    tokenOwnerRecord.pubkey,
    governanceAuthority,
    signatory,
    payer
  )

  const signatoryRecordAddress = await getSignatoryRecordAddress(
    MANGO_GOVERNANCE_PROGRAM,
    proposalAddress,
    signatory
  )
  const insertInstructions: TransactionInstruction[] = []
  for (const i in proposalInstructions) {
    const instruction = getInstructionDataFromBase64(
      serializeInstructionToBase64(proposalInstructions[i])
    )
    await withInsertTransaction(
      insertInstructions,
      MANGO_GOVERNANCE_PROGRAM,
      programVersion,
      governance,
      proposalAddress,
      tokenOwnerRecord.pubkey,
      governanceAuthority,
      Number(i),
      0,
      0,
      [instruction],
      payer
    )
  }
  withSignOffProposal(
    insertInstructions, // SingOff proposal needs to be executed after inserting instructions hence we add it to insertInstructions
    MANGO_GOVERNANCE_PROGRAM,
    programVersion,
    MANGO_REALM_PK,
    governance,
    proposalAddress,
    signatory,
    signatoryRecordAddress,
    undefined
  )

  const txChunks = chunk([...instructions, ...insertInstructions], 2)

  await sendSignAndConfirmTransactions({
    connection,
    wallet,
    transactionInstructions: txChunks.map((txChunk) => ({
      instructionsSet: txChunk.map((tx) => ({
        signers: [],
        transactionInstruction: tx,
      })),
      sequenceType: SequenceType.Sequential,
    })),
  })
  return proposalAddress
}