from datetime import datetime
from db import get_connection


def verify_seating(
    attendance_results,
    frame_shape,
    hall_id=1,
    exam_id=1
):

    print(
        "\nStarting seating verification..."
    )

    conn=get_connection()

    cur=conn.cursor()

    now=datetime.now()

    frame_height=frame_shape[0]
    frame_width=frame_shape[1]

    # determine hall layout automatically
    cur.execute(
        """
        SELECT
            MAX(row_number),
            MAX(column_number)

        FROM seat_allocations

        WHERE hall_id=%s
        AND exam_id=%s
        """,
        (
            hall_id,
            exam_id
        )
    )

    rows,cols=cur.fetchone()

    if rows is None or cols is None:

        print(
            "No seating data found"
        )

        cur.close()
        conn.close()

        return


    seat_width=frame_width/cols
    seat_height=frame_height/rows


    for student in attendance_results:

        student_id=student[
            "student_id"
        ]

        bbox=student[
            "bbox"
        ]

        x1,y1,x2,y2=map(
            int,
            bbox
        )

        center_x=(x1+x2)/2
        center_y=(y1+y2)/2


        detected_col=int(
            center_x/seat_width
        )+1

        detected_row=int(
            center_y/seat_height
        )+1


        cur.execute(
            """
            SELECT
                row_number,
                column_number

            FROM seat_allocations

            WHERE student_id=%s
            AND hall_id=%s
            AND exam_id=%s
            """,
            (
                student_id,
                hall_id,
                exam_id
            )
        )

        expected=cur.fetchone()


        if expected is None:

            print(
                f"No seat assigned for student {student_id}"
            )

            continue


        expected_row=expected[0]
        expected_col=expected[1]


        expected_seat=(
            chr(64+expected_col)
            +
            str(expected_row)
        )

        detected_seat=(
            chr(64+detected_col)
            +
            str(detected_row)
        )


        print(
            f"\nStudent: {student_id}"
        )

        print(
            f"Expected: {expected_seat}"
        )

        print(
            f"Detected: {detected_seat}"
        )


        if (
            expected_row!=detected_row
            or
            expected_col!=detected_col
        ):

            print(
                "Seat violation detected"
            )

            cur.execute(
                """
                INSERT INTO ai_alerts
                (
                    event_id,
                    type,
                    confidence,
                    timestamp,
                    hall_id,
                    exam_id,
                    student_id,
                    violation_id,
                    created_at
                )

                VALUES
                (
                    gen_random_uuid(),
                    %s,%s,%s,%s,%s,%s,%s,%s
                )
                """,
                (
                    "seat_violation",
                    1.0,
                    now,
                    hall_id,
                    str(exam_id),
                    student_id,
                    None,
                    now
                )
            )

        else:

            print(
                "Seat verified"
            )


    conn.commit()

    cur.close()

    conn.close()

    print(
        "\nSeating verification complete"
    )