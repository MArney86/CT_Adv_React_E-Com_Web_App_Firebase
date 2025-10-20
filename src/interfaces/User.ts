export interface User {
  uid: string;
  email: string;
  username: string;
  created: Date;
  isActive: boolean;
  accountDeleted: {
    isDeleted: boolean;
    deletionDate: Date | null;
  };
}