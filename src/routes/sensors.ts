import { Request, Response, Router } from "express";
import { sensorsDataSource } from "../services/data-source";

const router = Router();

/**
 * Fetch sensor records from the database, including their location and associated data
 */

router.get("/sensorsData/all-data", async (req: Request, res: Response) => {
  try {
    const allSensors = await sensorsDataSource
      .createQueryBuilder()
      .select('sensors.id', 'sensor_id')
      .addSelect('sensors.type', 'sensor_type')
      .addSelect('sensors.date_created', 'sensor_date_created')
      .addSelect('location.id', 'location_id')
      .addSelect('location.x', 'location_x')
      .addSelect('location.y', 'location_y')
      .addSelect('location.room', 'location_room')
      .addSelect('location.near', 'location_near')
      .addSelect('sensors_data.id', 'sensors_data_id')
      .addSelect('sensors_data.data', 'sensors_data_value')
      .addSelect('sensors_data.last_update', 'sensors_data_last_update')
      .from('sensors', 'sensors')
      .leftJoin("location", "location", "location.id = sensors.id")
      .leftJoin("sensorsData", "sensors_data", 'sensors.id = sensors_data."sensorId"')
      .getRawMany();

    const sensorsWithLocationAndData = allSensors.reduce((acc, row) => {
      const sensorId = row.sensor_id;

      // Initialize sensor object in the accumulator if not already present
      if (!acc[sensorId]) {
        acc[sensorId] = {
          id: row.sensor_id,
          type: Array.isArray(row.sensor_type) ? row.sensor_type : [row.sensor_type],
          date_created: row.sensor_date_created,
          location: {
            id: row.location_id,
            x: row.location_x,
            y: row.location_y,
            room: Array.isArray(row.location_room) ? row.location_room : [row.location_room],
            near: Array.isArray(row.location_near) ? row.location_near : [row.location_near],
          },
          sensors_data: [],
        };
      }

      // Populate sensors_data if the data exists for this sensor
      if (row.sensors_data_id) {
        acc[sensorId].sensors_data.push({
          id: row.sensors_data_id,
          data: Array.isArray(row.sensors_data_value) ? row.sensors_data_value : [row.sensors_data_value],
          last_update: row.sensors_data_last_update,
        });
      }

      return acc;
    }, {});

    // Convert the accumulator object to an array
    
    const organizedSensors = Object.values(sensorsWithLocationAndData);

    res.status(200).send(organizedSensors);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Failed to get sensors data");
  }
});

export default router;
