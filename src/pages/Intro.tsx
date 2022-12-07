import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Intro = () => {
  const nav = useNavigate();

  const [username, setUsername] = useState("");

  useEffect(() => {
    if ((window as any).__THAR_CONFIG) {
      setUsername((window as any).__THAR_CONFIG.userInfo.displayName);
    } else {
      nav("/error");
    }
  }, [(window as any).__THAR_CONFIG]);

  return (
    <Box
      sx={{
        marginTop: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography component="h3" variant="h5">
        Welcome {username} !
      </Typography>
      <Box
        sx={{
          marginTop: 2,
        }}
      >
        <Typography>
          Welcome to Twitter2Crossbell, <br />
          this is a small tool that can help you <br />
          post all exported tweets to crossbell automatically.
          <br />
          <br />
          In the following page you will able to set your character <br />
          and signer private key. Please ensure the signer has <br />
          enough gas or the transactions would be fail.
        </Typography>
        <Button
          type="button"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          onClick={() => {
            nav("/settings");
          }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default Intro;
