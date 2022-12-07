import React, { useEffect, useState } from "react";
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { TweetData } from "@/common/contract";
import Loading from "@/components/Loading";
import { getProgress, getSetting } from "@/common/session";
import { Add, Check } from "@mui/icons-material";

interface tweetsGroup {
  count: string;
  fileName: string;
  globalName: string;

  // Custom
  isMigrated?: boolean;
}

interface tweetsExportedMetadata {
  files: tweetsGroup[];
  mediaDirectory: string;
}

interface tweetPendingMigration {
  // Original tweet data
  tweet: TweetData;

  // Calculated
  isReply: boolean;
  isRetweet: boolean;

  // Let user select this
  isToMigrate: boolean;

  // Status
  isPendingMigrate: boolean;
  isMigrated: boolean;
}

const setTargetEntity = (parent: any, keys: string[], value: any) => {
  let tObj = value;
  for (let i = keys.length - 1; i > 0; i--) {
    let tParent: any = {};
    tParent[keys[i]] = tObj;
    tObj = tParent;
  }
  parent[keys[0]] = tObj;
};

const getFromEntity = (parent: any, keys: string[]) => {
  let tObj = parent[keys[0]];
  for (let i = 1; i < keys.length; i++) {
    tObj = tObj[keys[i]];
  }
  return tObj;
};

const Migrate = () => {
  const [isLoading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Loading tweet collections..."
  );

  const [tweetsMetadata, setTweetsMetadata] =
    useState<tweetsExportedMetadata>();
  const [groupTweets, setGroupTweets] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState("");

  const loadGroupTweets = (group: tweetsGroup) => {
    // Set
    setLoadingMessage("Loading tweets in group...");
    setLoading(true);

    // Get settings
    const settings = getSetting();

    // Prepare env
    setTargetEntity(window, group.globalName.split("."), []);

    // Load file
    // Create a new script node
    const groupScript = document.createElement("script");
    groupScript.src = group.fileName;
    groupScript.async = true;
    groupScript.onload = () => {
      // Process all tweets
      const allTweetsInGroup = getFromEntity(
        window,
        group.globalName.split(".")
      );

      // console.log("Tweets in group: ", allTweetsInGroup);

      const parsedTweets = allTweetsInGroup.map(
        (tweet: TweetData): tweetPendingMigration => {
          const isReply = !!tweet.in_reply_to_user_id_str;
          const isRetweet = tweet.tweet.full_text.startsWith("RT @");
          return {
            tweet,
            isReply,
            isRetweet,
            isToMigrate:
              (!settings.includeReply || !isReply) &&
              (!settings.includeRetweet || !isRetweet),
            isPendingMigrate: false,
            isMigrated: false,
          };
        }
      );

      console.log("Parsed tweets: ", parsedTweets);

      setGroupTweets(parsedTweets);
      setSelectedGroup(group.fileName);
      setLoading(false);
    };

    document.body.appendChild(groupScript);
  };

  useEffect(() => {
    // Get all twitter groups
    if ((window as any).__THAR_CONFIG) {
      const tweetData = (window as any).__THAR_CONFIG.dataTypes.tweets;
      console.log(tweetData);

      // Find already posted (if any)
      const progress = getProgress();
      for (const g of tweetData.files) {
        g.isMigrated = progress.finishedGroups.includes(g.fileName);
      }

      // Set list
      setTweetsMetadata(tweetData);

      // Finish loading
      setLoading(false);
    }
  }, [(window as any).__THAR_CONFIG]);

  return (
    <>
      <Loading open={isLoading} message={loadingMessage} />

      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Migrate
        </Typography>

        <Box display={"flex"} flexDirection={"row"} width={"100%"} mt={8}>
          <Box flex={1}>
            <Typography textAlign={"center"}>Tweets Groups</Typography>
            <List>
              {tweetsMetadata?.files.map((group, index) => (
                <ListItem key={group.fileName}>
                  <ListItemButton
                    disabled={group.isMigrated}
                    selected={selectedGroup === group.fileName}
                    onClick={() => {
                      if (selectedGroup !== group.fileName) {
                        loadGroupTweets(group);
                      }
                    }}
                  >
                    <ListItemIcon>
                      {group.isMigrated ? <Check /> : <Add />}
                    </ListItemIcon>
                    <ListItemText
                      primary={`Group ${index + 1}`}
                      secondary={`${group.count} tweets`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
          <Divider orientation={"vertical"} flexItem />
          <Box flex={1}>
            <Typography textAlign={"center"}>Tweets In Group</Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Migrate;
