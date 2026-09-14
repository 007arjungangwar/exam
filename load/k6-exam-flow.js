import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    ten_students: { executor: "constant-vus", vus: 10, duration: "1m" },
    thirty_students: { executor: "constant-vus", vus: 30, duration: "1m", startTime: "70s" },
    sixty_students: { executor: "constant-vus", vus: 60, duration: "1m", startTime: "140s" },
    one_twenty_students: { executor: "constant-vus", vus: 120, duration: "1m", startTime: "210s" }
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<750"]
  }
};

const baseUrl = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const res = http.get(baseUrl);
  check(res, { "landing page is available": (r) => r.status === 200 });
  sleep(1);
}
