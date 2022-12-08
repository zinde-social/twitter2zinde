import { Contract, NoteMetadataAttachmentBase } from "crossbell.js";
import type { NoteMetadata } from "crossbell.js";
import { ethers } from "ethers";
import { uploadFile, uploadJson } from "./ipfs";

let gContract: Contract | null = null;
let signerAddress: string = "";

let characterId: number = 0;

export const setContractCharacterId = (id: number) => {
  characterId = id;
};

export const initWithPrivateKey = async (privateKey: string) => {
  if (!privateKey) {
    throw new Error("No private key provided");
  }

  if (!privateKey.startsWith("0x")) {
    privateKey = `0x${privateKey}`;
  }

  try {
    // Initialize wallet address
    const w = new ethers.Wallet(privateKey);
    signerAddress = w.address;

    // Initialize contract instance
    gContract = new Contract(privateKey);
    await gContract.connect();
  } catch (e) {
    gContract = null;
    signerAddress = "";
    throw e;
  }
};

const getMetamaskProvider = async (): Promise<Contract> => {
  const provider = (window as any).ethereum;
  const uContract = new Contract(provider);
  await uContract.connect();
  return uContract;
};

export const getSignerAddress = (): string => {
  if (gContract === null) {
    throw new Error("Contract not initialized.");
  }

  return signerAddress;
};

export const getSignerBalance = async (): Promise<number> => {
  if (gContract === null) {
    throw new Error("Contract not initialized.");
  }

  const { data: csb } = await gContract.getBalance(signerAddress);
  if (csb) {
    return parseInt(csb);
  } else {
    return -1;
  }
};

export const checkOperator = async (): Promise<boolean> => {
  if (gContract === null) {
    throw new Error("Contract not initialized.");
  }

  const { data: permissions } =
    await gContract.getOperatorPermissionsForCharacter(
      characterId,
      signerAddress
    );

  console.log("Signer permissions: ", permissions);

  return permissions.includes("POST_NOTE");
};

export const addOperator = async () => {
  if (gContract === null) {
    throw new Error("Contract not initialized.");
  }

  // Set operator
  const uProvider = await getMetamaskProvider();
  await uProvider.grantOperatorPermissionsForCharacter(
    characterId,
    signerAddress,
    ["POST_NOTE"]
  );
};

export const removeOperator = async () => {
  if (gContract === null) {
    throw new Error("Contract not initialized.");
  }

  // Remove Operator
  const uProvider = await getMetamaskProvider();
  await uProvider.grantOperatorPermissionsForCharacter(
    characterId,
    signerAddress,
    []
  );
};

export interface TweetData {
  id_str: string;

  created_at: string;

  full_text: string;

  //retweeted: boolean; // it's just all false, use /^RT @\w+:/ instead
  extended_entities: {
    media: {
      media_url: string;
    }[];
  };

  in_reply_to_user_id_str?: string;
  in_reply_to_status_id_str?: string;
}

export const signerPostNote = async (
  user: string,
  tweet: TweetData,
  mediaDirectory: string
) => {
  if (gContract === null) {
    throw new Error("Contract not initialized.");
  }

  // Upload medias to IPFS
  const mediaAttachments: NoteMetadataAttachmentBase<"address">[] = [];
  for (const m of tweet.extended_entities.media) {
    const mediaFileName = `${tweet.id_str}-${m.media_url.split("/").pop()}`;
    const mediaFullName = `${mediaDirectory}/${mediaFileName}`;
    const result = await fetch(mediaFullName);
    const blob = await result.blob();
    const ipfsUri = await uploadFile(blob);
    mediaAttachments.push({
      name: mediaFileName,
      address: ipfsUri,
      mime_type: blob.type,
      size_in_bytes: blob.size,
      alt: mediaFileName,
    });
  }

  // Upload note
  const note: NoteMetadata = {
    type: "note",
    sources: ["T2C", "Twitter"],
    content: tweet.full_text,
    attachments: mediaAttachments,
    external_urls: [`https://twitter.com/${user}/status/${tweet.id_str}`],
  };

  const noteIPFSUri = await uploadJson(note);

  // Push on chain
  await gContract.postNote(characterId, noteIPFSUri);
};

export const checkDuplicate = async (
  user: string,
  tweetId: string
): Promise<boolean> => {
  const tweetUri = `https://twitter.com/${user}/status/${tweetId}`;
  try {
    const res = await fetch(
      `https://indexer.crossbell.io/v1/notes?externalUrls=${encodeURIComponent(
        tweetUri
      )}&includeDeleted=false&includeEmptyMetadata=false&limit=1`
    ).then((res) => res.json());
    return res.list?.length > 0;
  } catch (e) {
    console.log(e);
    return false;
  }
};
