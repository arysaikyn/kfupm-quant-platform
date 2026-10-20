.PHONY: doctor verify

doctor:
	@bash scripts/doctor.sh

verify: doctor
	@echo "verify: no test suite yet; doctor is the gate."
