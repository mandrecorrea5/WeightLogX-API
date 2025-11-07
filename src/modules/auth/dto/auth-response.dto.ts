export class AuthResponseDto {
  user: {
    id: string;
    fullName: string;
    email: string;
    birthDate: string | null;
    phone: string | null;
    trainingCenter: {
      id: string;
      name: string;
      abbreviation: string;
    } | null;
    trainingCenterId: string | null;
    trainingCenterName: string | null;
    profileImage: string | null;
  };
  token: string;
  message?: string;
}

