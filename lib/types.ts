export type Staff = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  workDays: number[];   // 0=dim, 1=lun, ..., 6=sam
  workStart: string;    // "09:00"
  workEnd: string;      // "19:00"
};

export type Service = {
  id: string;
  name: string;
  duration: number;     // minutes
  price: number | null; // null = sur devis
};

export type Booking = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  date: string;         // "YYYY-MM-DD"
  startTime: string;    // "10:00"
  endTime: string;      // "11:00"
  status: "pending" | "confirmed" | "cancelled";
  createdAt: number;
};

export type Closure = {
  id: string;
  date: string;         // "YYYY-MM-DD"
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
};
