from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from app.config import Config

user_stats_bp = Blueprint('user_stats', __name__)

# MongoDB connection
try:
    mongo_uri = Config.MONGODB_URI
    db_name = Config.MONGODB_DB_NAME
    quiz_history_collection_name = Config.MONGODB_QUIZ_HISTORY_COLLECTION
    roadmaps_collection_name = Config.MONGODB_ROADMAP_COLLECTION

    client = MongoClient(mongo_uri)
    db = client[db_name]
    quiz_history_collection = db[quiz_history_collection_name]
    roadmaps_collection = db[roadmaps_collection_name]

except Exception as e:
    quiz_history_collection = None
    roadmaps_collection = None


@user_stats_bp.route("/api/user-stats", methods=["GET"])
def get_user_stats():
    """Get real-time user statistics: Active Roadmaps, Skills Learning, Quizzes Made"""
    try:
        user_email = request.args.get('user_email')
        if not user_email:
            return jsonify({"error": "user_email parameter is required"}), 400
        
        if quiz_history_collection is None or roadmaps_collection is None:
            return jsonify({"error": "Database connection not available"}), 500
            
        # Initialize default values
        active_roadmaps_count = 0
        unique_skills_count = 0
        quizzes_made_count = 0
        
        # 1. Get Active Roadmaps Count
        try:
            active_roadmaps_count = roadmaps_collection.count_documents({"user_email": user_email})
        except Exception:
            active_roadmaps_count = 0
        
        # 2. Get Skills Learning (Total unique skills from all roadmaps)
        try:
            skills_pipeline = [
                {"$match": {"user_email": user_email}},
                {"$project": {
                    "skills": {"$ifNull": ["$data.nodes", []]}
                }},
                {"$unwind": "$skills"},
                {"$group": {
                    "_id": "$skills.id",
                    "skill_name": {"$first": "$skills.text"}
                }},
                {"$count": "unique_skills_count"}
            ]
            
            skills_result = list(roadmaps_collection.aggregate(skills_pipeline))
            unique_skills_count = skills_result[0].get("unique_skills_count", 0) if skills_result else 0
        except Exception:
            unique_skills_count = 0
        
        # 3. Get Quizzes Made Count
        try:
            quizzes_made_count = quiz_history_collection.count_documents({"userId": user_email})
        except Exception:
            quizzes_made_count = 0
        
        # Calculate estimated learning time based on actual activity
        estimated_learning_minutes = (quizzes_made_count * 8) + (unique_skills_count * 5)
        
        # Prepare response
        response_data = {
            "total_learning_minutes": estimated_learning_minutes,
            "quizzes_taken": quizzes_made_count,
            "active_roadmaps": active_roadmaps_count,
            "skills_learning": unique_skills_count,
            "roadmaps_created": active_roadmaps_count,
            "total_skills_learning": unique_skills_count
        }
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@user_stats_bp.route("/api/user-stats/session", methods=["POST"])
def save_user_session():
    """Deprecated: No session storage needed for real-time stats"""
    return jsonify({
        "success": True,
        "message": "Session tracking not needed - using real-time calculations",
        "deprecated": True
    }), 200


@user_stats_bp.route("/api/user-stats/debug", methods=["GET"])
def debug_user_stats():
    """Debug endpoint to verify data sources"""
    try:
        user_email = request.args.get('user_email')
        
        if not user_email:
            return jsonify({"error": "user_email parameter is required"}), 400
        
        if quiz_history_collection is None or roadmaps_collection is None:
            return jsonify({"error": "Database connection not available"}), 500
        
        # Check roadmaps data
        roadmap_sample = roadmaps_collection.find_one({"user_email": user_email})
        roadmap_count = roadmaps_collection.count_documents({"user_email": user_email})
        
        # Check quiz data  
        quiz_sample = quiz_history_collection.find_one({"userId": user_email})
        quiz_count = quiz_history_collection.count_documents({"userId": user_email})
        
        # Get sample skill structure from roadmap
        sample_skills = []
        if roadmap_sample and "data" in roadmap_sample and "nodes" in roadmap_sample["data"]:
            sample_skills = roadmap_sample["data"]["nodes"][:3]  # First 3 skills
        
        debug_info = {
            "user_email": user_email,
            "roadmaps": {
                "count": roadmap_count,
                "has_sample": roadmap_sample is not None,
                "sample_skills_structure": sample_skills
            },
            "quizzes": {
                "count": quiz_count,
                "has_sample": quiz_sample is not None,
                "sample_fields": list(quiz_sample.keys()) if quiz_sample else []
            }
        }
        
        return jsonify(debug_info), 200
        
    except Exception as e:
        return jsonify({"error": f"Debug error: {str(e)}"}), 500