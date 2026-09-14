FROM python:3.12-slim
RUN pip install --no-cache-dir pandas numpy
RUN useradd -m sandbox
WORKDIR /runner
COPY evaluate.py /runner/evaluate.py
USER sandbox
ENTRYPOINT []
