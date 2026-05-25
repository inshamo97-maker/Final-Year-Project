const pool = require("../db");
const { hashPassword } = require("../utils/password");

async function run() {
  const credentials = {
    admin: {
      name: "Admin EMS",
      email: "admin@ems.com",
      password: "password123",
      phone: "+92-300-0000000",
      department: "Administration",
      isAdmin: true,
    },
    invigilator: {
      name: "Invigilator EMS",
      email: "invigilator@ems.com",
      password: "inv12345",
      phone: "+92-300-1111111",
      department: "Computer Science",
      isAdmin: false,
    },
  };

  await pool.query("BEGIN");
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false`);
    await pool.query(`TRUNCATE TABLE invigilator_halls, reviews, users RESTART IDENTITY CASCADE`);

    const adminHash = await hashPassword(credentials.admin.password);
    const invHash = await hashPassword(credentials.invigilator.password);

    const adminResult = await pool.query(
      `INSERT INTO users (name, email, password, phone_number, department, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email`,
      [
        credentials.admin.name,
        credentials.admin.email,
        adminHash,
        credentials.admin.phone,
        credentials.admin.department,
        credentials.admin.isAdmin,
      ]
    );

    const invResult = await pool.query(
      `INSERT INTO users (name, email, password, phone_number, department, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email`,
      [
        credentials.invigilator.name,
        credentials.invigilator.email,
        invHash,
        credentials.invigilator.phone,
        credentials.invigilator.department,
        credentials.invigilator.isAdmin,
      ]
    );

    await pool.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          message: "Users reset successfully",
          admin: {
            id: adminResult.rows[0].id,
            email: credentials.admin.email,
            password: credentials.admin.password,
          },
          invigilator: {
            id: invResult.rows[0].id,
            email: credentials.invigilator.email,
            password: credentials.invigilator.password,
          },
        },
        null,
        2
      )
    );
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Failed to reset users:", error);
  process.exit(1);
});

