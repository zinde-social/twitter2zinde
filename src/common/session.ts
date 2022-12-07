export interface Setting {
  includeReply: boolean;
  includeRetweet: boolean;
  preventDuplicate: boolean;
  characterId: number;
}

export interface Progress {
  finishedGroups: string[];
  processingGroup: string;
  finishedIDs: string[];
}

const settingKey = "twitter2crossbell-setting";
const progressKey = "twitter2crossbell-session";
let currentSetting: Setting | null = null;
let currentProgress: Progress | null = null;

const initSetting = () => {
  const storedSetting = localStorage.getItem(settingKey);
  if (storedSetting) {
    currentSetting = JSON.parse(storedSetting);
  } else {
    // Initialize
    currentSetting = {
      includeReply: false,
      includeRetweet: false,
      preventDuplicate: true,
      characterId: 0,
    };
    localStorage.setItem(settingKey, JSON.stringify(currentSetting));
  }
};

const initProgress = () => {
  const storedProgress = localStorage.getItem(progressKey);
  if (storedProgress) {
    currentProgress = JSON.parse(storedProgress);
  } else {
    currentProgress = {
      finishedGroups: [],
      processingGroup: "",
      finishedIDs: [],
    };
    localStorage.setItem(progressKey, JSON.stringify(currentProgress));
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
  localStorage.setItem(settingKey, JSON.stringify(newSetting));
  console.log(newSetting);
};

export const setProgress = (newProgress: Progress) => {
  currentProgress = newProgress;
  localStorage.setItem(progressKey, JSON.stringify(newProgress));
  console.log(newProgress);
};
