UPDATE `tcg-application-portal`.`tcg-application-portal_application` as applications
INNER JOIN `tcg-application-portal`.`tcg-application-portal_applicationResponse` as responses 
	ON responses.applicationId = applications.id
SET applications.phase = "9e3a02d8-ac83-49de-bed1-6bc76c143950" 
WHERE 
	applications.submitted = 1 AND 
    responses.questionId = "d6363ac5-f7ff-4180-a6b4-0c105240ae96" AND 
    responses.value IN (
		"TEST PID"
	)
;