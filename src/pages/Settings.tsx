import React, { useEffect, useState } from "react";
import {
  Avatar,
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { PowerSettingsNewOutlined } from "@mui/icons-material";
import { getSetting, setSetting } from "@/common/session";
import {
  addOperator,
  checkOperator,
  getSignerAddress,
  initWithPrivateKey,
} from "@/common/contract";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const nav = useNavigate();

  const [privateKey, setPrivateKey] = useState("");
  const [characterId, setCharacterId] = useState(0);
  const [isIncludeReply, setIncludeReply] = useState(false);
  const [isIncludeRetweet, setIncludeRetweet] = useState(false);

  const [isShowingError, setShowingError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isShowingAddOperator, setShowingAddOperator] = useState(false);
  const [signerAddress, setSignerAddress] = useState("");

  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    const setting = getSetting();

    setCharacterId(setting.characterId);
    setIncludeReply(setting.includeReply);
    setIncludeRetweet(setting.includeRetweet);
  }, []);

  return (
    <>
      {/*Loading Animation*/}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <Box
          component="div"
          sx={{ mt: 1 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          <CircularProgress color="inherit" />
          <Typography component="h3" variant="h5">
            Loading...
          </Typography>
        </Box>
      </Backdrop>

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

      {/*Bind Operator Dialog*/}
      <Dialog
        open={isShowingAddOperator}
        onClose={() => {
          setShowingAddOperator(false);
        }}
        aria-labelledby="add-operator-dialog-title"
        aria-describedby="add-operator-dialog-description"
      >
        <DialogTitle id="add-operator-dialog-title">
          {"No operator permissions"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="add-operator-dialog-description">
            Current address is not authorized to sync for you: <br />
            {signerAddress} <br />
            But we can fix it. We are going to call MetaMask on your browser.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowingAddOperator(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setShowingAddOperator(false);
              setLoading(true);
              try {
                await addOperator();
              } catch (e: any) {
                console.log(e);
                setErrorMessage(e.message);
                setShowingError(true);
              }
              setLoading(false);
            }}
            variant="contained"
            autoFocus
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>

      {/*Page*/}
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
          <PowerSettingsNewOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          Settings
        </Typography>
        <Box component="div" sx={{ mt: 1 }}>
          <Grid>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Signer Private Key"
              type="password"
              name="privateKey"
              value={privateKey}
              onChange={(ev) => {
                setPrivateKey(ev.target.value);
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="characterId"
              label="Crossbell Character ID"
              type="number"
              aria-valuemin={1}
              value={characterId}
              onChange={(ev) => {
                setCharacterId(parseInt(ev.target.value));
              }}
            />
          </Grid>
          <Grid>
            <FormControlLabel
              control={
                <Checkbox
                  value={isIncludeReply}
                  onChange={(ev) => {
                    setIncludeReply(ev.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Include replies"
            />
          </Grid>
          <Grid>
            <FormControlLabel
              control={
                <Checkbox
                  value={isIncludeRetweet}
                  onChange={(ev) => {
                    setIncludeRetweet(ev.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Include retweets"
            />
          </Grid>
          <Button
            type="button"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              // Start loading
              setLoading(true);

              // Save settings
              setSetting({
                characterId,
                includeReply: isIncludeReply,
                includeRetweet: isIncludeRetweet,
              });

              // Set Character ID
              setCharacterId(characterId);

              // Use private key to initialize
              try {
                // Initialize
                await initWithPrivateKey(privateKey);

                // Check operator
                if (await checkOperator()) {
                  // Redirect
                  nav("/migrate");
                } else {
                  console.log("Oops, this operator is not authorized.");
                  setSignerAddress(getSignerAddress());
                  setShowingAddOperator(true);
                }
              } catch (e: any) {
                console.log(e);
                // Notify
                console.log("Oops, something is wrong.");
                setErrorMessage(e.message);
                setShowingError(true);
              }

              setLoading(false);
            }}
          >
            Start!
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default Settings;
