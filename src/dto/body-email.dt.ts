import { IsOptional, IsString } from "class-validator";

export class BodyEmail {
  @IsString()
  @IsOptional()
  email: string;
}