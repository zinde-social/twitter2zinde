import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { checkDuplicate, signerPostNote, TweetData } from "@/common/contract";
import Loading from "@/components/Loading";
import { getProgress, getSetting, setProgress } from "@/common/session";
import { AccessTime, Add, AddTask, Check } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

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

  const [isShowingError, setShowingError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [tweetsMetadata, setTweetsMetadata] =
    useState<tweetsExportedMetadata>();
  const [groupTweets, setGroupTweets] = useState<tweetPendingMigration[]>([]);

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
      const currentProgress = getProgress();

      const parsedTweets = allTweetsInGroup.map(
        (wrappedTweet: { tweet: TweetData }): tweetPendingMigration => {
          const tweet = wrappedTweet.tweet;
          const isReply = !!tweet.in_reply_to_status_id_str;
          const isRetweet = tweet.full_text.startsWith("RT @");
          const isMigrated = currentProgress.finishedIDs.includes(tweet.id_str);
          return {
            tweet,
            isReply,
            isRetweet,
            isToMigrate:
              !isMigrated &&
              (settings.includeReply || !isReply) &&
              (settings.includeRetweet || !isRetweet),
            isPendingMigrate: false,
            isMigrated,
          };
        }
      );

      parsedTweets.sort((a: tweetPendingMigration, b: tweetPendingMigration) =>
        new Date(a.tweet.created_at) > new Date(b.tweet.created_at) ? 1 : -1
      );

      console.log("Parsed and sorted tweets: ", parsedTweets);

      setGroupTweets(parsedTweets);
      setSelectedGroup(group.fileName);
      setLoading(false);
    };

    document.body.appendChild(groupScript);
  };

  const nav = useNavigate();

  const checkAllGroups = () => {
    // Get all twitter groups
    if ((window as any).__THAR_CONFIG) {
      const tweetData = (window as any).__THAR_CONFIG.dataTypes.tweets;
      console.log(tweetData);

      let nothingLeft = true;

      // Find already posted (if any)
      const progress = getProgress();
      for (const g of tweetData.files) {
        if (progress.finishedGroups.includes(g.fileName)) {
          g.isMigrated = true;
        } else {
          g.isMigrated = false;
          nothingLeft = false;
        }
      }

      if (nothingLeft) {
        nav("/finish");
      }

      // Set list
      setTweetsMetadata(tweetData);

      // Finish loading
      setLoading(false);
    }
  };

  useEffect(checkAllGroups, [(window as any).__THAR_CONFIG]);

  return (
    <>
      <Loading open={isLoading} message={loadingMessage} />

      {/*Error Dialog*/}
      <Dialog
        open={isShowingError}
        onClose={() => {
          setShowingError(false);
        }}
        aria-labelledby="error-dialog-title"
        aria-describedby="error-dialog-description"
      >
        <DialogTitle id="error-dialog-title">{"Oops"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="error-dialog-description">
            {errorMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowingError(false);
            }}
            autoFocus
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

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

        <Box
          sx={{
            marginTop: 2,
          }}
        >
          <Typography>
            Please pay attention to the twitter groups on the left side. <br />
            They may have different time period, and thus could be tricky <br />
            to post them to Crossbell if not ordered properly.
          </Typography>
          <Button
            type="button"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              setLoading(true);
              setLoadingMessage("Initializing basic information...");
              const username = (window as any).__THAR_CONFIG.userInfo.userName;
              const mediaDir = tweetsMetadata?.mediaDirectory;

              if (!username || !mediaDir) {
                nav("/error");
                return;
              }

              setProgress({
                ...getProgress(),
                processingGroup: selectedGroup,
                finishedIDs: [],
              });

              const settings = getSetting();

              try {
                for (let index = 0; index < groupTweets.length; index++) {
                  const tweet = groupTweets[index];
                  setLoadingMessage(
                    `Processing ${index} of ${groupTweets.length} notes...`
                  );
                  if (tweet.isToMigrate) {
                    setGroupTweets(
                      groupTweets
                        .slice(0, index)
                        .concat([
                          {
                            ...tweet,
                            isPendingMigrate: true,
                          },
                        ])
                        .concat(
                          groupTweets.slice(index + 1, groupTweets.length)
                        )
                    );
                    if (settings.preventDuplicate) {
                      // Try to check tweet status
                      if (await checkDuplicate(username, tweet.tweet.id_str)) {
                        // Already posted
                        continue; // Skip
                      }
                    }
                    await signerPostNote(username, tweet.tweet, mediaDir);
                    const progress = getProgress();
                    setProgress({
                      ...progress,
                      finishedIDs: progress.finishedIDs.concat(
                        tweet.tweet.id_str
                      ),
                    });
                    setGroupTweets(
                      groupTweets
                        .slice(0, index)
                        .concat([
                          {
                            ...tweet,
                            isPendingMigrate: false,
                            isMigrated: true,
                          },
                        ])
                        .concat(
                          groupTweets.slice(index + 1, groupTweets.length)
                        )
                    );
                  }
                }

                console.log(selectedGroup, "finished");

                const progress = getProgress();
                setProgress({
                  ...progress,
                  finishedGroups: progress.finishedGroups.concat(selectedGroup),
                  processingGroup: "",
                });

                checkAllGroups();
              } catch (e: any) {
                console.log(e);
                setErrorMessage(e.message);
                setShowingError(true);
              }

              setLoading(false);
            }}
            disabled={selectedGroup === ""}
          >
            Start processing this group
          </Button>
        </Box>

        <Box display={"flex"} flexDirection={"row"} width={"100%"} mt={8}>
          <Box>
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
            <List>
              {groupTweets.map((tweet, index) => (
                <ListItem key={tweet.tweet.id_str}>
                  <ListItemButton
                    onClick={() => {
                      setGroupTweets(
                        groupTweets
                          .slice(0, index)
                          .concat([
                            {
                              ...tweet,
                              isToMigrate: !tweet.isToMigrate,
                            },
                          ])
                          .concat(
                            groupTweets.slice(index + 1, groupTweets.length)
                          )
                      );
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge={"start"}
                        checked={tweet.isToMigrate}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={tweet.tweet.full_text}
                      secondary={new Date(
                        tweet.tweet.created_at
                      ).toLocaleString()}
                      style={{
                        whiteSpace: "pre-wrap",
                      }}
                    />
                    <ListItemIcon>
                      {tweet.isMigrated ? (
                        <Check />
                      ) : tweet.isPendingMigrate ? (
                        <AccessTime />
                      ) : tweet.isToMigrate ? (
                        <AddTask />
                      ) : (
                        <></>
                      )}
                    </ListItemIcon>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Migrate;
