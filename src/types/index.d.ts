interface NavigatorWithNetworkInfo extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

interface NetworkInformation {
  downlink: number;
  downlinkMax?: number;
  effectiveType: string;
  rtt: number;
  saveData: boolean;
  type: string;
  addEventListener?: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener?: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) => void;
}

export type NetworkStateT = {
  online: boolean;
  downlink: number | null;
  downlinkMax: number | null;
  effectiveType: string | null;
  rtt: number | null;
  saveData: boolean | null;
  type: string | null;
};

export type NetworkServerErrorStateT = {
  error: string | null;
};
