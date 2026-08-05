// Screenshot fixtures. The `?mockRole=` URL bypass has been removed for security:
// mock mode is permanently disabled and every route requires a real session.
import { MOCK_ATHLETES, MOCK_VIDEOS, MOCK_EVENTS, MOCK_COACH_REQUESTS } from "./mock-data";

export function isMockMode() {
  return false;
}


export function mockAthletesList(): any { return MOCK_ATHLETES; }
export function mockMyAthlete(): any {
  return { ...MOCK_ATHLETES[0], athlete_videos: MOCK_VIDEOS.filter(v => v.athlete_id === "a1"), athlete_events: MOCK_EVENTS.filter(e => e.athlete_id === "a1") };
}
export function mockAthleteFull(id: string): any {
  const athlete: any = MOCK_ATHLETES.find(a => a.id === id) ?? MOCK_ATHLETES[0];
  return {
    athlete: { ...athlete, user_id: "mock-user" },
    videos: MOCK_VIDEOS.filter(v => v.athlete_id === athlete.id),
    events: MOCK_EVENTS.filter(e => e.athlete_id === athlete.id).map(e => ({ ...e, event_time: "6:00 PM", is_mayb: true, notes: null })),
  };
}
export function mockCoachRequests(): any { return MOCK_COACH_REQUESTS; }
export function mockSavedAthletes(): any {
  return [
    { id: "s1", notes: "Great motor", athletes: MOCK_ATHLETES[0] },
    { id: "s2", notes: "", athletes: MOCK_ATHLETES[2] },
  ];
}
