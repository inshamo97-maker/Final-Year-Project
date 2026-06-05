import threading

_buffers = {}
_locks = {}

def get_or_create(hall_id):
    if hall_id not in _buffers:
        _buffers[hall_id] = None
        _locks[hall_id] = threading.Lock()


def push_frame(hall_id, frame):
    get_or_create(hall_id)


    with _locks[hall_id]:
        _buffers[hall_id] = frame.copy()


def get_frame(hall_id):
    if hall_id not in _buffers:
        return None

    with _locks[hall_id]:
        return _buffers[hall_id].copy()


def release(hall_id):
    _buffers.pop(hall_id, None)
    _locks.pop(hall_id, None)