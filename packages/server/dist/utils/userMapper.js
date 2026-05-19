export function mapUser(row) {
    let weakAreas = [];
    try {
        weakAreas = JSON.parse(row.weak_areas);
    }
    catch {
        weakAreas = [];
    }
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        stageId: row.stage_id,
        yearsOfPractice: row.years_of_practice,
        planProgress: row.plan_progress,
        contentMastery: row.content_mastery,
        points: row.points,
        streak: row.streak,
        weakAreas,
        assessmentDone: row.assessment_done === 1,
    };
}
