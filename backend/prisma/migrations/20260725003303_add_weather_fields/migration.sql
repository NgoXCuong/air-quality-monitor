-- AlterTable
ALTER TABLE "WeatherData" ADD COLUMN     "humidity" DOUBLE PRECISION,
ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "windSpeed" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "WeatherData_locationId_timestamp_idx" ON "WeatherData"("locationId", "timestamp");
