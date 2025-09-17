export const apiPath = "http://localhost:3000";

export type TTask = {
  uuid: number;
  user_id: number;
  todo: string;
  start_date: Date;
  end_date: Date;
};

export type TUser = {
  uuid: number;
  name: string;
  username: string;
  password: string;
};

export type TPosition = {
  uuid: number;
  name: string;
};
