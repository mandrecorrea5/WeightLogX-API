export class AuthResponseDto {
  user: {
    id: string;
    fullName: string;
    email: string;
    birthDate: string | null;
    phone: string | null;
    trainingCenter: string | null;
    profileImage: string | null;
  };
  token: string;
  message?: string;
}

