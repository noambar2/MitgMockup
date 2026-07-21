import {
  AppointmentCard,
  SectionHeading,
  upcomingAppointments,
  pastAppointments,
} from "./TasksAppointmentsPage";

export default function MyAppointmentsPage() {
  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
            <div className="md:max-w-[760px] md:mx-auto">

      {/* <div className="text-right mb-1">
        <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight inline">
          הזימונים שלי<span className="text-[#69c600]">.</span>
        </h2>
      </div>
      <p className="text-[#171c23] text-[14px] opacity-50 text-right mb-8">
        כאן ניתן לצפות בכל הזימונים שלך - לאשר הגעה, להזיז זימון
        ולנווט למיקום
      </p> */}

      {/* Upcoming */}
      <SectionHeading title="זימונים עתידיים" />
      <div className="grid grid-cols-1 gap-4 items-stretch mb-10">
        {upcomingAppointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
          />
        ))}
      </div>

      {/* Past */}
      <SectionHeading title="זימונים קודמים" />
      <div className="grid grid-cols-1 gap-4 items-stretch">
        {pastAppointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            past
          />
        ))}
      </div>
      </div>
    </section>
  );
}
