import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { removeOperator } from "@/common/contract";
import Loading from "@/components/Loading";

const Finish = () => {
  const [isLoading, setLoading] = useState(false);

  return (
    <>
      <Loading open={isLoading} message={"Loading..."} />
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h3" variant="h5">
          Finally!
        </Typography>
        <Box
          sx={{
            marginTop: 2,
          }}
        >
          <Typography>
            Migration is now finished, thanks for your patience.
            <br />
            Don't forget to unauthorizing the operator, for safety concerns!
          </Typography>
          <Button
            type="button"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              try {
                setLoading(true);
                await removeOperator();
                localStorage.clear();
                window.close();
              } catch (e) {
                console.log(e);
              }
            }}
          >
            Unauthorize Operator
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default Finish;
