export let validateBody = (schema) => {
	return (req, res, next) => {
		try {
			// Combine req.body, req.query, and req.params into a single object for validation
			const dataToValidate = {
				...req.body,    // Merge req.body
				...req.query,   // Merge req.query
				...req.params   // Merge req.params
			};

			console.log(dataToValidate); // Log the combined data for validation

			// Validate the combined data
			const result = schema.validate(dataToValidate);

			if (result.error) {
				// Collect and format error messages
				let errors = result.error.details.map(detail => detail.message);
				return next(new RequestError(errors, 400));
			}

			// Proceed to the next middleware if validation passes
			next();
		} catch (error) {
			console.log(error);
			next(error);
		}
	};
};
