export type User = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type Session = {
  user: User;
  accessToken: string;
  refreshToken: string;
};
