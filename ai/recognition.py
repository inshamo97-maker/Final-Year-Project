from insightface.app import FaceAnalysis

app = FaceAnalysis(
    name='buffalo_s'
)

app.prepare(
    ctx_id=-1,
    det_size=(320,320)
)