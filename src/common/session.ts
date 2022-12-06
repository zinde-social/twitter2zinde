export interface Setting {
  includeReply: boolean;
  includeRetweet: boolean;
  characterId: number;
}

export interface Progress {
  currentGroup: string;
  currentFinishedId: string;
}

const settingKey = "twitter2crossbell-setting";
const progressKey = "twitter2crossbell-session";
let currentSetting: Setting | null = null;
let currentProgress: Progress | null = null;

const initSetting = () => {
  const storedSetting = sessionStorage.getItem(settingKey);
  if (storedSetting) {
    currentSetting = JSON.parse(storedSetting);
  } else {
    // Initialize
    currentSetting = {
      includeReply: false,
      includeRetweet: false,
      characterId: 0,
    };
    sessionStorage.setItem(settingKey, JSON.stringify(currentSetting));
  }
};

const initProgress = () => {
  const storedProgress = sessionStorage.getItem(progressKey);
  if (storedProgress) {
    currentProgress = JSON.parse(storedProgress);
  } else {
    currentProgress = {
      currentGroup: "",
      currentFinishedId: "",
    };
    sessionStorage.setItem(progressKey, JSON.stringify(currentProgress));
  }
};

export const getSetting = (): Setting => {
  if (!currentSetting) {
    initSetting();
  }

  return currentSetting!;
};

export const getProgress = (): Progress => {
  if (!currentProgress) {
    initProgress();
  }

  return currentProgress!;
};

export const setSetting = (newSetting: Setting) => {
  currentSetting = newSetting;
  sessionStorage.setItem(settingKey, JSON.stringify(newSetting));
  console.log(newSetting);
};

export const setProgress = (newProgress: Progress) => {
  currentProgress = newProgress;
  sessionStorage.setItem(progressKey, JSON.stringify(newProgress));
  console.log(newProgress);
};
