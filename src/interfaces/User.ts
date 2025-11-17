export interface User {
  uid: string;
  email: string | null;
  username: string | null;
  created: string; // ISO string format for serialization
  isActive: boolean;
  accountDeleted: {
    isDeleted: boolean;
    deletionDate: string | null; // ISO string format for serialization
  };
  orders: number[];
}